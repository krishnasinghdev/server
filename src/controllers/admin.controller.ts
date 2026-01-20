import type { AppContext } from "../types"
import * as adminService from "../services/admin.service"
import { response } from "../utils/response"

// Admin controller - placeholder for admin-specific operations
// This can be extended with admin-specific handlers

export const getAdminStats = async (c: AppContext) => {
  const db = c.get("db")
  const stats = await adminService.getAdminStats(db)
  return response.r200(c, stats)
}
