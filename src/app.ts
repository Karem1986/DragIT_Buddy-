//Drag and drop interfaces
interface Draggable {
  //two event listeners
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
}

//Project type (filtering between active and finished)
enum ProjectStatus {
  Active,
  Finished,
} //enum is an identifier because we got two options: active and finished projects

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {}
}

//Project State Management
type Listener<T> = (items: T[]) => void;

//Class to manage project state management for list of projects-if there is
//more than one state, a general class to manage multiples states,
//would be best (prototypical inheritance)

class State<T> {
  protected listeners: Listener<T>[] = [];

  addListener(listenerFunction: Listener<T>) {
    this.listeners.push(listenerFunction);
  }
}

class ProjectState extends State<Project> {
  //will listen to "Add Project" and add to the active projects list
  private projects: Project[] = [];
  //function listeners that will be called whenever something changes

  private static instance: ProjectState;
  private constructor() {
    super();
  }
  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }

  addProject(title: string, description: string, numOfPeople: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      numOfPeople,
      ProjectStatus.Active //by default all projects added are active
    );

    this.projects.push(newProject);
    for (const listenerFunction of this.listeners) {
      listenerFunction(this.projects.slice());
    }
  }
}

const projectState = ProjectState.getInstance(); //this singleton gets passed inside the event handler

//Generic Component Class- example of prototypical inheritance
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement;
  hostElement: T;
  element: U;

  constructor(
    templateId: string,
    hostElementId: string,
    insertAtStart: boolean,
    newElementId?: string
  ) {
    this.templateElement = document.getElementById(
      templateId
    )! as HTMLTemplateElement; //type casting: specifies that the content will not be null.
    this.hostElement = document.getElementById(hostElementId)! as T;

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as U;
    if (newElementId) {
      this.element.id = newElementId;
    }
    this.attach(insertAtStart);
  }
  private attach(insertAtBeggining: boolean) {
    this.hostElement.insertAdjacentElement(
      insertAtBeggining ? "afterbegin" : "beforeend",
      this.element
    );
  }

  abstract configure(): void;
  abstract renderContent(): void;
}

///----Specific components start here:----//

//Validation form
interface Validation {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}
function validateForm(validationInput: Validation) {
  let isValid = true;
  if (validationInput.required) {
    isValid = isValid && validationInput.value.toString().trim().length !== 0;
  }
  if (
    validationInput.minLength != null &&
    typeof validationInput.value === "string"
  ) {
    isValid =
      isValid && validationInput.value.length > validationInput.minLength;
  }
  if (
    validationInput.maxLength != null &&
    typeof validationInput.value === "string"
  ) {
    isValid =
      isValid && validationInput.value.length > validationInput.maxLength;
  }
  if (
    validationInput.min != null &&
    typeof validationInput.value === "number"
  ) {
    isValid = isValid && validationInput.value > validationInput.min;
  }
  if (
    validationInput.max != null &&
    typeof validationInput.value === "number"
  ) {
    isValid = isValid && validationInput.value < validationInput.max;
  }

  return isValid;
}
//autobind decorator
function autobind(
  target: any,
  methodName: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    },
  };
  return adjDescriptor;
}

// Project input to render the form and the user input
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    super("project-input", "app", true, "user-input");
    this.titleInputElement = this.element.querySelector(
      "#title"
    ) as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector(
      "#description"
    ) as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector(
      "#people"
    ) as HTMLInputElement;

    this.configure();
  }

  configure() {
    this.element.addEventListener("submit", this.submitHandler.bind(this));
  }

  renderContent() {}

  //Listen for each input on the form
  private fetchUserInput(): [string, string, number] | void {
    const enterTitle = this.titleInputElement.value;
    const enterDescription = this.descriptionInputElement.value;
    const enterPeople = this.peopleInputElement.value;
    //Form validation
    const titleValidationInput: Validation = {
      value: enterTitle,
      required: true,
    };
    const descriptionValidationInput: Validation = {
      value: enterDescription,
      required: true,
      minLength: 5,
    };
    const peopleValidationInput: Validation = {
      value: +enterPeople,
      required: true,
      min: 0,
      max: 5,
    };

    if (
      !validateForm(titleValidationInput) ||
      !validateForm(descriptionValidationInput) ||
      !validateForm(peopleValidationInput)
    ) {
      alert("please provide all required information ");
    } else {
      return [enterTitle, enterDescription, +enterPeople]; //the + converts it to a number.
    }
  }

  //Clear all inputs after clicking on "Add Project"

  //1. add a new private method
  private clearInput() {
    this.titleInputElement.value = "";
    this.descriptionInputElement.value = "";
    this.peopleInputElement.value = "";
  }

  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();
    // console.log(this, this.descriptionInputElement.value);
    const userInput = this.fetchUserInput();
    if (Array.isArray(userInput)) {
      //if userInput is an array (tuples are arrays) then return the tuple:
      const [title, desc, people] = userInput;
      console.log(title, desc, people);
      projectState.addProject(title, desc, people);
      this.clearInput(); //to clear all fields after clicking on "Add project"
    }
  }
}

// ProjectItem class: to render a single project item
class ProjectItem
  extends Component<HTMLUListElement, HTMLLIElement>
  implements Draggable {
  private project: Project;

  //Getter to render the correct text, if is one person or multiple:

  get persons() {
    if (this.project.people === 1) {
      return "1 person";
    } else {
      return `${this.project.people} persons`;
    }
  }
  constructor(hostId: string, project: Project) {
    super("single-project", hostId, false, project.id);
    this.project = project;
    this.configure();
    this.renderContent();
  }

  @autobind
  dragStartHandler(event: DragEvent) {
    event.dataTransfer!.setData("text/plain", this.project.id);
    event.dataTransfer!.effectAllowed = "move";
  }
  dragEndHandler(_: DragEvent) {
    console.log("DragEnd");
  }

  configure() {
    //Listening for drag and drop: here the drag and drop events will be configured
    this.element.addEventListener("dragstart", this.dragStartHandler);
    this.element.addEventListener("dragend", this.dragEndHandler);
  }
  renderContent() {
    this.element.querySelector("h2")!.textContent = this.project.title;
    this.element.querySelector("h3")!.textContent = this.persons + " assigned";
    this.element.querySelector("p")!.textContent = this.project.description;
  }
}

//Rendering the project lists -this applies prototypical inheritance
class ProjectLists
  extends Component<HTMLDivElement, HTMLElement>
  implements DragTarget {
  assignedProjects: Project[];

  constructor(private type: "active" | "finished") {
    super("project-list", "app", false, `${type}-projects`);
    this.assignedProjects = [];

    this.configure();
    this.renderContent();
  }

  @autobind
  dragOverHandler(event: DragEvent) {
    if (event.dataTransfer && event.dataTransfer.types[0] === "text/plain") {
      event.preventDefault();
      const listElement = this.element.querySelector("ul")!;
      listElement.classList.add("droppable");
    }
  }
  dropHandler(event: DragEvent) {
    console.log(event.dataTransfer!.getData("text/plain")); //CANNOT see it in the console
  }

  @autobind
  dragLeaveHandler(_: DragEvent) {
    const listElement = this.element.querySelector("ul")!;
    listElement.classList.remove("droppable");
  }

  configure() {
    //drag and drop event listeners also specified here:
    this.element.addEventListener("dragover", this.dragOverHandler);
    this.element.addEventListener("dragleave", this.dragLeaveHandler);
    this.element.addEventListener("drop", this.dropHandler);

    projectState.addListener((projects: Project[]) => {
      //Before we add the projects we want to filter them: active vs finished
      const filteredProjects = projects.filter((item) => {
        if (this.type === "active") {
          return item.status === ProjectStatus.Active;
        }
        return item.status === ProjectStatus.Finished;
      });

      this.assignedProjects = filteredProjects;
      this.renderProjects();
    });
  }

  renderContent() {
    const listId = `${this.type}-project-list`;
    this.element.querySelector("ul")!.id = listId;
    this.element.querySelector("h2")!.textContent =
      this.type.toUpperCase() + " PROJECTS";
  }

  //rendering all projects in a list
  private renderProjects() {
    const listEl = document.getElementById(
      `${this.type}-project-list`
    )! as HTMLUListElement;
    //To fix the duplicate project issue, we need to set innerHTML to an
    //empty string so each time we get rid of all list items and then re-render
    listEl.innerHTML = "";
    for (const projectItems of this.assignedProjects) {
      new ProjectItem(this.element.querySelector("ul")!.id, projectItems);
    }
  }
}

//INSTANTIATIONS HERE:
const myForm = new ProjectInput();
const activeProjectLists = new ProjectLists("active");
const finishedProjectLists = new ProjectLists("finished");
