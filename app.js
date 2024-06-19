import fs from "fs";
import path from "path";
import readline from "readline";

import { IgApiClient } from 'instagram-private-api';
import dotenv from "dotenv";
dotenv.config();

/* TODO: 
    // find way around 2fa?
    // set up proxy URL
    // sequence / fragment requests to avoid penalties
    // improve validation
    // automate user dataset retrieval
    // different data sources: non-following users that liked my post, etc.
*/

/**
 * Send an Instagram DM to some number of users selected from a text list.
 * 
 * @param {string} filePath The path to the text list.
 * @param {number} [amt=1] The number of users to DM.
 */

const ig = new IgApiClient();

const isValid = (filePath, amt) => {
    const validPath = `txt/${path.basename(filePath)}`; 
    return filePath === validPath && (!amt || !isNaN(Number(amt)));
}

const parseLines = async (filePath) => {
    const fileStream = fs.createReadStream(filePath);
    const lr = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    const lines = [];
    for await (const line of lr) {
        lines.push(line);
    }
    return lines;
}

const login = async () => {
    // ig.state.proxyUrl = process.env.IG_PROXY;    
    ig.state.generateDevice(process.env.IG_USERNAME);
    await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
}

const messageUsers = async (arr, count) => {
    const selectedUsers = new Set();
    
    let idx, user = null;
    for (let i = 0; i < Math.floor(count); i++) {
        while (!user || selectedUsers.has(user)) {
            idx = Math.floor(arr.length * Math.random());
            user = arr[idx];
        }

        /* TEST REQUEST:
        // const id = await ig.user.getIdByUsername(`joelaul`);
        // await thread.broadcastText(`Hey, saw that you liked my comment on Spiro's post. We put out a track together called Huckleberry Sin, and we'll probably have more on the way, so I'd be stoked if you followed to stay tuned!`);
        // console.log(`Messaging user joelaul...`);
        */
        const id = await ig.user.getIdByUsername(user);
        const thread = ig.entity.directThread([id.toString()]);
        console.log(`Messaging user #${idx + 1}: ${user}...`);
        await thread.broadcastText(`test`);

        selectedUsers.add(user);
    }
}

const main = async (filePath, count = 1) => {
    if (!isValid(filePath, count)) {
        console.error('Invalid argument(s).');
        return;
    }

    await login();
    const arr = await parseLines(filePath);
    await messageUsers(arr, count);
}

let [,, filePath, count] = process.argv;
main(filePath, count);