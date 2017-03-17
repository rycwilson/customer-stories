class AddShowFreqToWidgets < ActiveRecord::Migration
  def change
    add_column :widgets, :show_freq, :integer, default: 7
  end
end
