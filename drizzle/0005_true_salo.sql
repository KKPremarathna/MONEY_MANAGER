ALTER TABLE `categories` ADD `synced` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `transactions` ADD `synced` integer DEFAULT false;