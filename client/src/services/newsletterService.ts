import { apiPost } from "./api";

export async function subscribeNewsletter(email: string, origin = "popup") {
    return apiPost("/api/store/newsletter/subscribe", { email, origin });
}
