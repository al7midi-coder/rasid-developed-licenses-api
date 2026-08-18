import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticateUser } from '../services/google-users.js';
import { confirmPasswordReset, requestPasswordReset } from '../services/password-reset.js';

const loginSchema=z.object({loginId:z.string().trim().min(1).max(320),password:z.string().min(1).max(200)});
const requestSchema=z.object({email:z.string().trim().max(320)});
const confirmSchema=z.object({token:z.string().trim().min(20).max(500),newPassword:z.string().min(6).max(200)});

export const authRoutes:FastifyPluginAsync=async app=>{
  app.post('/login',async request=>{
    const body=loginSchema.parse(request.body||{});
    const user=await authenticateUser(body.loginId,body.password);
    if(!user) throw Object.assign(new Error('اسم المستخدم أو البريد الإلكتروني أو كلمة المرور غير صحيحة.'),{statusCode:401});
    return {ok:true,user};
  });
  app.post('/password-reset/request',async request=>{
    const body=requestSchema.parse(request.body||{});
    return requestPasswordReset(body.email,request.ip);
  });
  app.post('/password-reset/confirm',async request=>{
    const body=confirmSchema.parse(request.body||{});
    return confirmPasswordReset(body.token,body.newPassword);
  });
};
