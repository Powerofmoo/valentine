import { webMethod, Permissions } from 'wix-web-module';
import {getSecret} from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';

// CACHE - init
let cache = {};

export const imageAIML = webMethod(Permissions.Anyone, async (requestId, model, prompt) =>
{

    // CACHE - START
    cache[requestId] = 'processing';
    _expire(90*1000, requestId);

    // call AI/ML
    const key = await getSecret("AIML_API_KEY");

    if (prompt.length > 500) prompt =prompt.substring(0,500);

    const data = {
        method: "POST",
        headers: {
            Authorization: "Bearer " + key,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "dall-e-3", // model,
            prompt: prompt,
            n: 1,
            response_format: "url",
            size: "1024x1024" // "256x256",
        })
    }

    const result = await fetch("https://api.aimlapi.com/images/generations", data).then((res) => res.json());

    // CACHE - END
    if (cache[requestId]) cache[requestId] = result;
    return {
        status: 'complete',
        data: result,
    };

});

export const chatAIML = webMethod(Permissions.Anyone, async (model, messages, temperature) =>
{
    const key = await getSecret("AIML_API_KEY");

    const data = {
        method: "POST",
        headers: {
            Authorization: "Bearer " + key,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            max_tokens: 2048,
            temperature: temperature,
            stream: false,
        })
    }

    return await fetch("https://api.aimlapi.com/v1/chat/completions", data).then((res) => res.json());
});


// CACHE - helper
export const getCacheAIML = webMethod (
    Permissions.Anyone,
    async (requestId) => {
        if (!cache[requestId]) return { status: 'expired'};
        if ( cache[requestId] === "processing") return { status: 'processing'};
        return {
            status: "complete",
            data: cache[requestId]
        }
    }
);

// CACHE - expire
async function _expire(time, requestId) {
    setTimeout(() => {
        delete cache[requestId];
    }, time)
}