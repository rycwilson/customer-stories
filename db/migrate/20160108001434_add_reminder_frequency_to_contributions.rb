class AddReminderFrequencyToContributions < ActiveRecord::Migration
  def change
    add_column :contributions, :reminder_frequency, :integer, default: 1
  end
end
