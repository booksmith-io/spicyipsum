/* functions for interacting with the spicyipsum site
*/

async function getWords(payload) {
    return await makeAPICall("/api", "post", payload);
}

async function makeAPICall(endpoint, method, payload) {
    const requestUri = endpoint;

    const request = {
        method: method,
    };

    if (method === "post") {
        request.headers = {
            "content-type": "application/json",
        };

        if (payload) {
            request.body = JSON.stringify(payload);
        }
    }

    let response, body;
    try {
        response = await fetch(requestUri, request);

        if (response.body) {
            body = await response.text();
            if (body) {
                body = JSON.parse(body);
            }
        }
    } catch (error) {
        return [error];
    }

    return [response, body];
}
