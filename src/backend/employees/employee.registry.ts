import type { EmployeeOperatingContract, EmployeePillar } from "./employee.types.js";
import { RESEARCH_STRATEGY_EMPLOYEES } from "./employee.catalog.js";
import { NotFoundError } from "../errors/base.error.js";

export class EmployeeRegistry {
  private readonly catalog: Map<string, EmployeeOperatingContract>;

  constructor(initialCatalog: Record<string, EmployeeOperatingContract> = RESEARCH_STRATEGY_EMPLOYEES) {
    this.catalog = new Map(Object.entries(initialCatalog));
  }

  public getEmployee(id: string): EmployeeOperatingContract {
    const employee = this.catalog.get(id);
    if (!employee) {
      throw new NotFoundError(`AI Employee with ID '${id}' not found in registry`);
    }
    return employee;
  }

  public listEmployees(): EmployeeOperatingContract[] {
    return Array.from(this.catalog.values());
  }

  public getEmployeesByPillar(pillar: EmployeePillar): EmployeeOperatingContract[] {
    return this.listEmployees().filter((emp) => emp.identity.pillar === pillar);
  }

  public hasEmployee(id: string): boolean {
    return this.catalog.has(id);
  }
}

export const employeeRegistry = new EmployeeRegistry();
