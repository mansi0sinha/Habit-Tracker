import {z} from "zod";
const registerSchema=z.object({
    email:z.email(),
    password:z.string().min(6),
    timezone:z.string().refine(value=>{
        try{
            Intl.DateTimeFormat(undefined,{
                timeZone:value
            });
            return true;
        }catch(error){
            return false;
        }
        
    })
});
export {registerSchema};