import { Router } from "express";
import { loginHandler } from "../auth/auth";

const router = Router();

router.post("/login", loginHandler);

export default router;
