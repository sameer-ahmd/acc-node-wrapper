export interface CarInformation {
  CarIndex: number;
  CarModelType: number;
  TeamName: string;
  RaceNumber: number;
  CupCategory: number;
  CurrentDriverIndex: number;
  Drivers: string[];
  Nationality: string;
}

/*==== CarInfo Class ====*/
class CarInfo {
  CarIndex: number = 0;
  CarModelType: number | null = null;
  TeamName = "";
  RaceNumber: number = 0;
  CupCategory: number | null = null;
  CurrentDriverIndex: number = 0;
  Drivers: any[] = [];
  Nationality: number = 0;

  constructor(CarIndex) {
    this.CarIndex = CarIndex;
  }

  getCurrentDriver() {
    if (this.CurrentDriverIndex < this.Drivers.length)
      return this.Drivers[this.CurrentDriverIndex]["LastName"];
    return "nobody(?)";
  }
}

export default CarInfo;
