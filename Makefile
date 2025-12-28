SHELL := bash

.PHONY: install
install:
	@echo -n "Are you sure? [y/N] " && read ans && if [ $${ans:-'N'} != 'y' ]; then echo "exiting" && false; fi
	@echo
	@echo "installing JS dependencies"
	@npm install
	@echo
	@echo "creating database"
	@bash bin/create_database
	@echo
	@echo "applying database patches"
	@bash bin/apply_database_patches
	@echo
	@echo "install is complete"

.PHONY: update_deps
update_deps:
	@echo -n "Are you sure? [y/N] " && read ans && if [ $${ans:-'N'} != 'y' ]; then echo "exiting" && false; fi
	@echo
	@echo "updating JS dependencies"
	@npm install
	@echo
	@echo "update_deps is complete"

.PHONY: upgrade
upgrade:
	@echo -n "Are you sure? [y/N] " && read ans && if [ $${ans:-'N'} != 'y' ]; then echo "exiting" && false; fi
	@echo
	@echo "updating repo"
	@git fetch --quiet && git reset --hard origin/main && git pull
	@echo
	@echo "upgrade is complete"

.PHONY: upgrade_database
upgrade_database:
	@echo -n "Are you sure? [y/N] " && read ans && if [ $${ans:-'N'} != 'y' ]; then echo "exiting" && false; fi
	@echo
	@echo "applying database patches"
	@bash bin/apply_database_patches
	@echo
	@echo "upgrade_database is complete"

