/* functions for interacting with the spicyipsum site
*/

async function getWords() {
    return await makeAPICall(`/api`, 'get');
}

async function makeAPICall(endpoint, method, payload) {
    const requestUri = endpoint;

    let request = {
        method: method,
    };

    if (method === 'post') {
        request.headers = {
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        };

        if (payload) {
            request.body = new URLSearchParams(payload);
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
