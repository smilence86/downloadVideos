import config from 'config';
import CronJob from 'cron';
import { crawler } from './src/crawler.js';

const interval = config.get('interval') || 10;  // unit: minutes

// const job = new CronJob.CronJob(`0 */${interval} * * * *`, async () => {

//     await crawler.start();

// }, null, true);

// job.start();


(async () => {
    await crawler.start();
})();
console.info(`Job started...\n`);
