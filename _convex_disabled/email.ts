"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import nodemailer from "nodemailer";
import { internal } from "./_generated/api";

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    text: v.optional(v.string()),
    shulId: v.optional(v.string()), // Optional: if provided, tries to looks up custom SMTP
  },
  handler: async (ctx, args) => {
    let transporter;

    // 1. Fetch custom SMTP config securely
    const config = await ctx.runQuery(internal.settings.getSecretSmtpConfig, { shulId: args.shulId });

    if (config) {
      transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_port === 465, // true for 465, false for other ports usually
        auth: {
          user: config.smtp_user,
          pass: config.smtp_pass_encrypted, // Using the stored password
        },
      });
    } else {
      // 2. Default System Transporter (if no custom config found)
      // For local dev, we might use Ethereal or just console log if not configured
      if (!process.env.SMTP_HOST) {
        console.log("No Custom or System SMTP configured. Mocking email send.");
        console.log(`To: ${args.to}, Subject: ${args.subject}`);
        console.log("Content:", args.text);
        return { success: true, mocked: true };
      }

      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    try {
      const info = await transporter.sendMail({
        from: '"ShulGenius System" <system@shulgenius.com>',
        to: args.to,
        subject: args.subject,
        text: args.text || "No text content",
        html: args.html,
      });

      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email: " + error.message);
    }
  },
});
