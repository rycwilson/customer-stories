class AddNotesToContributions < ActiveRecord::Migration
  def change
    add_column :contributions, :notes, :text
  end
end
