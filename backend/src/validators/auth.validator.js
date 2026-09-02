import {z} from "zod";
const registerSchema=z.object({
    email:z.email()
});
export {registerSchema};