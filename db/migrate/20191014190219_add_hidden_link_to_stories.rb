class AddHiddenLinkToStories < ActiveRecord::Migration[5.0]
  def change
    add_column :stories, :hidden_link, :string
  end
end
