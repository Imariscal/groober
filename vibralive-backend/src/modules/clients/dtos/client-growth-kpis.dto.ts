/**
 * Client Growth KPIs DTO
 * Strategic KPIs focused on client registration growth
 */
export class ClientGrowthKPIsDto {
  /**
   * Number of new clients registered today
   */
  newClientsToday: number = 0;

  /**
   * Number of new clients registered in the last 7 days
   */
  newClientsThisWeek: number = 0;

  /**
   * Number of new clients registered this month
   */
  newClientsThisMonth: number = 0;

  /**
   * Growth percentage compared to previous month
   * Can be negative (e.g., -15.5) or positive (+25.3)
   */
  growthPercentage: number = 0;

  /**
   * Total clients registered last month (for context)
   */
  clientsLastMonth: number = 0;

  /**
   * Average daily registrations this month
   */
  dailyAverage: number = 0;

  /**
   * Total active clients (status = ACTIVE)
   */
  activeClients: number = 0;

  /**
   * Total clients overall (all statuses)
   */
  totalClients: number = 0;

  /**
   * Timestamp when KPIs were calculated
   */
  timestamp: Date = new Date();
}

export class ClientGrowthKPIsResponseDto {
  success: boolean = false;
  data: ClientGrowthKPIsDto = new ClientGrowthKPIsDto();
}
