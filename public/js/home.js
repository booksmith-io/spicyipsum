/* functionality for the home page
*/

$(function() {
    document.querySelector("form#get-ipsum-form").addEventListener("submit", async function(e) {
        e.preventDefault();

        const form = $(this);
        const form_inputs = $(this).serializeArray();

        const params = {};
        form_inputs.forEach(function (value, index) {
            params[value.name] = value.value;
        });

        const response = await getWords(params);

        if (response[0].ok === true) {
            let spicyipsum_text = response[1]["data"].join("\n\n");

            const spicyipsum_div = document.querySelector("div#spicyipsum");
            const spicyipsum_textarea = document.querySelector("div#spicyipsum textarea");

            spicyipsum_textarea.addEventListener("change", function() {
                this.style.height = "auto";
                this.style.height = this.scrollHeight + 3 + "px";
            });

            spicyipsum_textarea.innerHTML = spicyipsum_text;

            // this is hacky, but necessary.  setting the innerHTML doesn't immediately redraw
            // the page to allow getting a correct scrollHeight on the textarea.  we need to
            // set a timeout of 0 so the browser can finish what it was doing, otherwise the
            // height of the textarea will be set to 0px.
            setTimeout(function() {
                spicyipsum_textarea.style.height = "auto";
                spicyipsum_textarea.style.height = spicyipsum_textarea.scrollHeight + 3 + "px";
            }, 0);

            spicyipsum_div.classList.remove("d-none");

            return;
        }

        const alert_div = document.querySelector("#alert");

        let alert_message = "Unable to get spice";
        if (response[1]["message"]) {
            alert_message = `${response[1]["message"]}`;
        }

        alert_div.innerHTML = alert_message;
        alert_div.classList.add("alert-danger");
        alert_div.classList.remove("d-none");

        return;
    });

    document.querySelector("button#copy").addEventListener("click", async function(e) {
        const copy_button = e.target;

        const spicyipsum_textarea = document.querySelector("div#spicyipsum textarea");
        spicyipsum_textarea.select();
        spicyipsum_textarea.setSelectionRange(0, 99999); // for mobile devices

        // navigator.clipboard is only available over https.
        // while we're never going to be running in production over http, if the writeText
        // operation fails, then we need to give the user a different message than "copied"
        // since it's not technically accurate.
        let error = false;
        try {
            await navigator.clipboard.writeText(spicyipsum_textarea.innerHTML);
        } catch (err) {
            console.error("the copy to clipboard functionality failed.  the text has instead been highlighted, but not copied.");
            error = true;
        }

        if (!error) {
            copy_button.innerHTML = "Copied";
        }
        else {
            copy_button.innerHTML = "Highlighted (copy it manually)";
        }

        return;
    });
});
