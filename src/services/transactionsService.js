import { TransactionModel } from "../models/transaction.model.js";
import { DepositModel } from "../models/deposit.model.js";
import { UserModel } from "../models/user.model.js";
import { CardModel } from "../models/card.model.js";
import { decryptCard } from "../utils/decryptCard.js";
import {
  transferValidation,
  getTransactionsValidation,
  depositValidation,
} from "../middleware/transactionValidation.js";

export const transactionService = async (
  senderId,
  receiverId,
  amount,
  cardNumber,
  cardId
) => {
  try {
    const { error } = transferValidation.validate({
      senderId,
      receiverId,
      amount,
      cardNumber,
      cardId,
    });
    if (error) {
      throw new Error(error.details[0].message);
    }

    const card = await CardModel.findOne({ _id: cardId });
    const user = await UserModel.findOne({ _id: senderId });

    if (!card) {
      throw new Error("Card not found.");
    }

    const cardExpDate = new Date(card.expirationDate);

    if (cardExpDate < new Date()) {
      throw new Error("Card expired");
    }

    const isValidCard = await decryptCard(card.encryptionIV, card.cardNumber);

    if (isValidCard !== cardNumber) {
      throw new Error("Invalid card number");
    }

    if (amount > user.balance || amount <= 0) {
      throw new Error("Invalid amount");
    }

    const transaction = new TransactionModel({
      sender: senderId,
      receiver: receiverId,
      amount: amount,
    });

    await transaction.save();

    await UserModel.findOneAndUpdate(
      { _id: senderId },
      { $inc: { balance: -amount } }
    );
    await UserModel.findByIdAndUpdate(receiverId, {
      $inc: { balance: +amount },
    });

    return transaction;
  } catch (error) {
    console.log(error);
    throw new Error("Database update error");
  }
};

export const depositService = async (cardId, amount, cardNumber) => {
  try {
    const { error } = depositValidation.validate({
      cardId,
      amount,
      cardNumber,
    });
    if (error) {
      throw new Error(error.details[0].message);
    }

    const card = await CardModel.findOne({ _id: cardId });

    const cardExpDate = new Date(card.expirationDate);

    if (cardExpDate < new Date()) {
      throw new Error("Card expired");
    }

    if (!card) {
      throw new Error("Card not found.");
    }

    const decryptedCardNumber = await decryptCard(
      card.encryptionIV,
      card.cardNumber
    );

    if (decryptedCardNumber !== cardNumber) {
      console.log("Invalid card number");
      throw new Error("Invalid card number.");
    } else {
      const deposit = new DepositModel({
        cardId,
        amount,
      });

      await deposit.save();

      await UserModel.findOneAndUpdate(
        { _id: card.userId },
        { $inc: { balance: amount } }
      );

      return deposit;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Database error. Please try again.");
  }
};

export const getTransactionsService = async (userId) => {
  try {
    const { error } = getTransactionsValidation.validate({ userId });
    if (error) {
      throw new Error(error.details[0].message);
    }

    if (!userId) {
      throw new Error("User not found");
    }

    const transactions = await TransactionModel.find({
      $or: [{ sender: userId }, { receiver: userId }],
    }).sort({ createdAt: -1 });

    if (!transactions) {
      throw new Error("Transactions not found");
    }

    return transactions;
  } catch (error) {
    console.log(error);
    throw new Error("Database update error");
  }
};
