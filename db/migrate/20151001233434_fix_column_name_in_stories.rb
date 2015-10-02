class FixColumnNameInStories < ActiveRecord::Migration

  def change
    change_table :stories do |t|
      t.rename :quot_attr, :quote_attr
    end
  end

end
