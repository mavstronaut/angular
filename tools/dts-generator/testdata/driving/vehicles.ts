export interface Vehicle {
	honk();
}

export class Car implements Vehicle {
	honk() { console.log("beep beep"); }
}