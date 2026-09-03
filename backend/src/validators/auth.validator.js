import {z} from "zod";
const registerSchema=z.object({
    email:z.email(),
    password:z.string().min(6),
    timezone:z.string()
});
export {registerSchema};