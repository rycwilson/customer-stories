class ChangeReminderWaitTimes < ActiveRecord::Migration
  def up
    change_column :contributions, :first_reminder_wait, :integer, default: 2
    change_column :contributions, :second_reminder_wait, :integer, default: 3
  end
  def down
    change_column :contributions, :first_reminder_wait, :integer, default: 1
    change_column :contributions, :second_reminder_wait, :integer, default: 2
  end
end
