import { dataSource } from "./data-source";
import { runSeeders } from "typeorm-extension";

async function seed() {
  await dataSource.initialize();
  console.log("DataSource initialized");

  await runSeeders(dataSource);
  console.log("Seeding completed");

  await dataSource.destroy();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
