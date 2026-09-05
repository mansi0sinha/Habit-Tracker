import { z } from "zod";
const habitSchema=z.object({
    name:z.string(),
    description:z.string().optional()
});
export {habitSchema};