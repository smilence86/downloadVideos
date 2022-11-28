import fs from 'fs';
import os from 'os';
import path from 'path';
import config from 'config';
import jsonfile from 'jsonfile';
import superagent from 'superagent';
import { wechat } from './notifier/wechat.js';
import { telegram } from './notifier/telegram.js';
import randomUseragent from 'random-useragent';
import Bluebird from 'bluebird';
import { open } from 'node:fs/promises';
import child_process from 'child_process';
import util from 'util';
const exec = util.promisify(child_process.exec);

class Crawler {

    constructor () {

        this.sources = [
            'https://raw.githubusercontent.com/YanG-1989/m3u/main/Adult.m3u'
        ];

        this.downloadFolder = this.getDownloadFolder();
        
        this.startFromLine = this.getStartFromLine();
    }

    getStartFromLine() {
        return config.get('startFromLine');
    }

    getDownloadFolder() {
        const folder = path.join(process.cwd(), 'videoList', 'Adult');
        console.log(`folder: ${folder}`);
        return folder;
    }

    async start() {

        console.time(`总耗时：`);

        await Bluebird.map(this.sources, async (pageUrl) => {

            const videos = await this.crawler(pageUrl);

        }, { concurrency: 1 });

        console.timeEnd(`总耗时：`);
    }

    async crawler(pageUrl) {

        const fileName = pageUrl.substring(pageUrl.lastIndexOf('/') + 1);
        console.log(fileName);

        const folder = this.downloadFolder;

        const filePath = path.join(folder, fileName);
        console.log(filePath);

        await this.downloadFile(pageUrl, filePath);

        await this.downloadVideos(filePath);
    }

    async totalLines(filePath) {
        const file = await open(filePath);
        let i = 0;
        for await (const line of file.readLines()) {
            ++i;
        }
        console.log(`totalLines: ${i}`);
        return i;
    }

    async downloadVideos(filePath) {
        const file = await open(filePath);
        const totalLines = await this.totalLines(filePath);
        let lastLine = '';
        let index = 1;
        for await (const line of file.readLines()) {

            if (index < startFromLine) {
                console.log(`skip line: ${index}`);
                continue;
            }

            console.log(`Processing: ${index}/${totalLines}, ${line}`);

            if (line.startsWith('http')) {
                const [ group, name ] = this.parseFileName(lastLine, index);
                const videoPath = path.join(this.downloadFolder, `${group}_${name}`);
                await this.convertM3u8ToMp4(line, `${videoPath}.mp4`);
            }
            lastLine = line;
            ++index;
        }
    }

    parseFileName(line, index) {
        let group = '';
        let name = 'none' + index;
        try {
            group = line.split('"')[1];
            name = line.substring(line.lastIndexOf(',') + 1);
            name = name.replace(/\//g, '-');
        } catch (err) {
            console.log(err.stack || err);
        }
        return [group, name];
    }

    async downloadFile(url, filePath) {
        return new Promise(async (resolve, reject) => {
            const stream = fs.createWriteStream(filePath);
            superagent.get(url).timeout(30 * 1000).pipe(stream);
            stream.on('finish', async () => {
                console.log(`Download file finished: ${filePath}`);
                resolve(filePath);
            });
            stream.on('error', async (error) => {
                reject(error);
            });
        });
    }

    async convertM3u8ToMp4(url, filePath, retry = 0, retryMax = 5) {
        const command = `ffmpeg -i "${url}" -bsf:a aac_adtstoasc -vcodec copy -c copy -crf 50 "${filePath}"`;
        try {
            await this.execShell(command);
        } catch (err) {
            console.log(err.stack || err);

            ++retry;

            console.log(`重试第${retry}次，url: ${url}`);

            if (retry <= retryMax) {
                await this.convertM3u8ToMp4(url, filePath, retry, retryMax);
            }
        }
    }

    async execShell(cmd) {
        console.log(`cmd: ${cmd}`);
        let result = null;
        try {
            
            const { stdout, stderr } = await exec(cmd);
            
            result = stdout || stderr;

            // console.log(`execShell stdout: ${stdout}`);

            if (stderr) {
                console.log(`execShell stderr: ${stderr}`);
                // throw new Error(stderr);
            }
        } catch (e) {
            console.log(`execShell exception:`);
            console.error(e.stack || e);
            result = e.stack || e;
            throw result;
        }
        return result;
    }

}

export const crawler = new Crawler();
