import mongoose from "mongoose";
import dotenv from "dotenv";
import Card from "./src/models/Card";

dotenv.config();

const MONGODB_URI = "mongodb+srv://pokemon:pokemon2025~~@cluster0.py0v7jr.mongodb.net/pokemonDB?retryWrites=true&w=majority&appName=Cluster0";

const cards = [
  {
    cardName: "파이리",
    cardType: "fire",
    attack: 10,
    hp: 25,
    image2D: "/images/fireTier1_2d.png",
    image3DColor: "/models/fireTier1_color.glb",
    image3DGray: "/models/fireTier1_gray.glb",
  },
  {
    cardName: "포니타",
    cardType: "fire",
    attack: 40,
    hp: 100,
    image2D: "/images/fireTier2_2d.png",
    image3DColor: "/models/fireTier2_color.glb",
    image3DGray: "/models/fireTier2_gray.glb",
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");

    // 기존 카드 데이터 모두 삭제
    await Card.deleteMany({});
    console.log("Existing cards deleted");

    // 카드 데이터 삽입
    await Card.insertMany(cards);
    console.log("Seed data inserted");

    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}

seed();
