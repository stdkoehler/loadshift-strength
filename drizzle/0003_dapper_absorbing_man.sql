ALTER TABLE `cycles` ADD `is_template` integer DEFAULT false NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cycles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`start_date` text,
	`length_weeks` integer DEFAULT 8 NOT NULL,
	`wave_length_weeks` integer,
	`is_active` integer DEFAULT false NOT NULL,
	`is_template` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_cycles`("id", "name", "start_date", "length_weeks", "wave_length_weeks", "is_active", "is_template", "created_at") SELECT "id", "name", "start_date", "length_weeks", "wave_length_weeks", "is_active", "is_template", "created_at" FROM `cycles`;--> statement-breakpoint
DROP TABLE `cycles`;--> statement-breakpoint
ALTER TABLE `__new_cycles` RENAME TO `cycles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `logs` ADD `soll_reps` integer;--> statement-breakpoint
ALTER TABLE `logs` ADD `soll_weight` real;--> statement-breakpoint
ALTER TABLE `logs` ADD `soll_rir` real;