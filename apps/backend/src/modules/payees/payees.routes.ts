/**
 * Payees routes placeholder for saved payees.
 */

import { Router, type Router as ExpressRouter } from "express";

/**
 * Express router for managing payee resources.
 */
export const payeesRouter: ExpressRouter = Router();

payeesRouter.get("/", (_request, response) => {
  response.status(200).json({ data: [], message: "Payees endpoint placeholder" });
});

payeesRouter.post("/", (_request, response) => {
  response.status(501).json({ message: "Create payee not implemented" });
});

payeesRouter.put("/:id", (_request, response) => {
  response.status(501).json({ message: "Update payee not implemented" });
});

payeesRouter.delete("/:id", (_request, response) => {
  response.status(501).json({ message: "Delete payee not implemented" });
});
