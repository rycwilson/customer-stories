class ChangeReminderWaitTimes < ActiveRecord::Migration
  def change
    change_column :contributions, :first_reminder_wait, :integer, default: 3
    change_column :contributions, :second_reminder_wait, :integer, default: 3
  end
end
