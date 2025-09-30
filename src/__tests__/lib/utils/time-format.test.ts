import {
  calculateTimeProgress,
  formatMinutesToTime,
} from "@/lib/utils/time-format";

describe("formatMinutesToTime", () => {
  it("should return '0m' for zero minutes", () => {
    expect(formatMinutesToTime(0)).toBe("0m");
  });

  it("should return '0m' for null", () => {
    expect(formatMinutesToTime(null)).toBe("0m");
  });

  it("should return '0m' for undefined", () => {
    expect(formatMinutesToTime(undefined)).toBe("0m");
  });

  it("should format minutes only (less than 60)", () => {
    expect(formatMinutesToTime(15)).toBe("15m");
    expect(formatMinutesToTime(30)).toBe("30m");
    expect(formatMinutesToTime(45)).toBe("45m");
    expect(formatMinutesToTime(59)).toBe("59m");
  });

  it("should format hours only (when minutes is 0)", () => {
    expect(formatMinutesToTime(60)).toBe("1h");
    expect(formatMinutesToTime(120)).toBe("2h");
    expect(formatMinutesToTime(180)).toBe("3h");
    expect(formatMinutesToTime(240)).toBe("4h");
  });

  it("should format hours and minutes", () => {
    expect(formatMinutesToTime(90)).toBe("1h 30m");
    expect(formatMinutesToTime(150)).toBe("2h 30m");
    expect(formatMinutesToTime(135)).toBe("2h 15m");
    expect(formatMinutesToTime(195)).toBe("3h 15m");
  });

  it("should handle large numbers", () => {
    expect(formatMinutesToTime(600)).toBe("10h");
    expect(formatMinutesToTime(725)).toBe("12h 5m");
  });
});

describe("calculateTimeProgress", () => {
  it("should return 0 for null estimated time", () => {
    expect(calculateTimeProgress(null, 60)).toBe(0);
  });

  it("should return 0 for undefined estimated time", () => {
    expect(calculateTimeProgress(undefined, 60)).toBe(0);
  });

  it("should return 0 for null actual time", () => {
    expect(calculateTimeProgress(120, null)).toBe(0);
  });

  it("should return 0 for undefined actual time", () => {
    expect(calculateTimeProgress(120, undefined)).toBe(0);
  });

  it("should return 0 when both are null", () => {
    expect(calculateTimeProgress(null, null)).toBe(0);
  });

  it("should calculate progress percentage correctly", () => {
    expect(calculateTimeProgress(120, 60)).toBe(50);
    expect(calculateTimeProgress(100, 25)).toBe(25);
    expect(calculateTimeProgress(200, 150)).toBe(75);
  });

  it("should round to nearest integer", () => {
    expect(calculateTimeProgress(90, 30)).toBe(33); // 33.33...
    expect(calculateTimeProgress(90, 60)).toBe(67); // 66.66...
  });

  it("should cap at 100% (not exceed)", () => {
    expect(calculateTimeProgress(60, 120)).toBe(100);
    expect(calculateTimeProgress(100, 150)).toBe(100);
    expect(calculateTimeProgress(50, 200)).toBe(100);
  });

  it("should return 100% when actual equals estimated", () => {
    expect(calculateTimeProgress(120, 120)).toBe(100);
    expect(calculateTimeProgress(60, 60)).toBe(100);
  });
});
