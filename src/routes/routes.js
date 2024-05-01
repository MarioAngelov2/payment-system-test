import { Router } from "express";
import { register } from "../controllers/register.js";
import { login } from "../controllers/login.js";
import { createCard } from "../controllers/createCard.js";
import { getCards } from "../controllers/getCards.js";
import { deleteCard } from "../controllers/deleteCard.js";
import { deposit } from "../controllers/deposit.js";
import { transaction } from "../controllers/transaction.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/create-card", createCard);
router.get("/get-cards/:id", getCards);
router.delete("/delete-card/:id", deleteCard);
router.post("/deposit", deposit);
router.post("/transaction", transaction);

export { router };
