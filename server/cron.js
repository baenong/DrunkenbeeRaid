import cron from "node-cron";
import Party from "./models/Party";

/**
 * @ schedule : seconds minutes hours day month weekday
 * @ 0 0 10 * * 3 : every wdensday reset parties
 */
const resetCron = cron.schedule(
  "0 0 8 * * Wed",
  async () => {
    await Party.updateMany(
      { fixed: { $not: true } },
      {
        weekday: "수",
        startAt: "08:00",
      }
    );
    console.log(`Cron Validate : ${cron.validate("0 0 8 * * Wed")}`);
    console.log(`[${new Date()}] Reset party start time`);
  },
  { scheduled: false }
);

export default resetCron;
