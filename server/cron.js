import cron from "node-cron";
import Party from "./models/Party";
import { logger } from "./log";

/**
 * @ schedule : seconds minutes hours day month weekday
 * @ 0 0 10 * * 3 : every wdensday reset parties
 */
const resetCron = cron.schedule(
  "0 0 8 * * Wed",
  async () => {
    await Party.updateMany(
      { fixed: { $ne: true } },
      {
        weekday: "수",
        startAt: "08:00",
      }
    );
    logger.info(`Cron Validate : ${cron.validate("0 0 8 * * Wed")}`);
    logger.info(`[${new Date()}] Reset party start time`);
  },
  { scheduled: false }
);

export default resetCron;
