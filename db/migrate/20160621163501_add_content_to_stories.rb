class AddContentToStories < ActiveRecord::Migration
  def change
    add_column :stories, :content, :text, default: "<p><strong>Situation</strong></p><p>Situation description</p><p><strong>Challenge</strong></p><p>Challenge description</p><p><strong>Solution</strong></p><p>Solution description</p><p><strong>Benefits</strong></p><p>Benefits description</p>"
  end
end
