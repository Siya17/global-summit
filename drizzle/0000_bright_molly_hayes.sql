CREATE TABLE `group_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`group_name` text NOT NULL,
	`group_key` text NOT NULL,
	`participant_names` text DEFAULT '' NOT NULL,
	`responses_json` text DEFAULT '{}' NOT NULL,
	`submitted` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `submissions_session_group_idx` ON `group_submissions` (`session_id`,`group_key`);--> statement-breakpoint
CREATE TABLE `regulations` (
	`id` text PRIMARY KEY NOT NULL,
	`number` integer NOT NULL,
	`title` text NOT NULL,
	`legal_text` text NOT NULL,
	`evidence_for` text NOT NULL,
	`evidence_challenge` text NOT NULL,
	`evidence_data_point` text NOT NULL,
	`sources_json` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regulations_number_unique` ON `regulations` (`number`);--> statement-breakpoint
CREATE TABLE `summit_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_code` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`thresholds_json` text NOT NULL,
	`framework_json` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `summit_sessions_session_code_unique` ON `summit_sessions` (`session_code`);