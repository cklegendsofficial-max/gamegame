import { describe, expect, it } from "vitest";
import { FIRST_BLOOD_ARMY, FIRST_BLOOD_CAMP, QUESTS } from "../src/game/quests";
import { armySize } from "../src/game/data";

describe("öğretici görevler", () => {
  it("başlıklar tekil, köle görevleri hürriyetten önce", () => {
    const titles = QUESTS.map((q) => q.title);
    expect(new Set(titles).size).toBe(titles.length);
    const slave = QUESTS.filter((q) => q.slave);
    expect(slave.length).toBe(2);
    expect(slave[0]!.title).toBe("Efendinin ocakları");
    expect(slave[1]!.title).toBe("Hürriyet bedeli");
    expect(slave[1]!.text).toMatch(/60/);
    expect(QUESTS.some((q) => q.title === "İlk kan")).toBe(true);
  });

  it("ilk kan çetesi küçük ve kovalamaz", () => {
    expect(FIRST_BLOOD_CAMP).toBeLessThan(0);
    expect(armySize(FIRST_BLOOD_ARMY)).toBeLessThanOrEqual(5);
    expect(FIRST_BLOOD_ARMY.horse).toBe(0);
  });
});
