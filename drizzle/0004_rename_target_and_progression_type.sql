ALTER TABLE `logs` RENAME COLUMN `soll_reps` TO `target_reps`;
--> statement-breakpoint
ALTER TABLE `logs` RENAME COLUMN `soll_weight` TO `target_weight`;
--> statement-breakpoint
ALTER TABLE `logs` RENAME COLUMN `soll_rir` TO `target_rir`;
--> statement-breakpoint
UPDATE `exercises` SET `progression_type` = 'constant' WHERE `progression_type` = 'konstant';
--> statement-breakpoint
UPDATE `exercises` SET `progression_type` = 'phased' WHERE `progression_type` = 'phasen';
