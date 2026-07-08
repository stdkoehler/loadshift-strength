CREATE TABLE `cycles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`length_weeks` integer DEFAULT 8 NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `days` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cycle_id` integer NOT NULL,
	`weekday` integer NOT NULL,
	`name` text NOT NULL,
	`focus` text,
	`is_rest` integer DEFAULT false NOT NULL,
	`order_index` integer NOT NULL,
	FOREIGN KEY (`cycle_id`) REFERENCES `cycles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `days_cycle_weekday_unique` ON `days` (`cycle_id`,`weekday`);--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day_id` integer NOT NULL,
	`name` text NOT NULL,
	`progression_type` text DEFAULT 'konstant' NOT NULL,
	`pause_min` real,
	`notes` text,
	`order_index` integer NOT NULL,
	FOREIGN KEY (`day_id`) REFERENCES `days`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cycle_id` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	`set_index` integer NOT NULL,
	`log_date` text NOT NULL,
	`week_number` integer NOT NULL,
	`actual_reps` integer,
	`actual_weight` real,
	`done` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`cycle_id`) REFERENCES `cycles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `logs_exercise_set_date_unique` ON `logs` (`exercise_id`,`set_index`,`log_date`);--> statement-breakpoint
CREATE TABLE `phases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cycle_id` integer NOT NULL,
	`name` text NOT NULL,
	`start_week` integer NOT NULL,
	`end_week` integer NOT NULL,
	`color` text,
	`order_index` integer NOT NULL,
	FOREIGN KEY (`cycle_id`) REFERENCES `cycles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `set_targets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`set_id` integer NOT NULL,
	`phase_id` integer,
	`reps` integer,
	`base_weight` real,
	`increment_per_week` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`set_id`) REFERENCES `sets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`phase_id`) REFERENCES `phases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`exercise_id` integer NOT NULL,
	`set_index` integer NOT NULL,
	`role` text,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
