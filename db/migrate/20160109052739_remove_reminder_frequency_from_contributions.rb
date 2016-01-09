class RemoveReminderFrequencyFromContributions < ActiveRecord::Migration

  def change
    remove_column :contributions, :reminder_frequency
    add_column :contributions, :remind_1_wait, :integer, default: 1
    add_column :contributions, :remind_2_wait, :integer, default: 2
  end

end
