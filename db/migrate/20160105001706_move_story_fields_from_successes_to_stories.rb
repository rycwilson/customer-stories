class MoveStoryFieldsFromSuccessesToStories < ActiveRecord::Migration

  def change

    add_column :stories, :approved, :boolean, default: false
    remove_column :successes, :story_approved

    add_column :stories, :published, :boolean, default: false
    remove_column :successes, :story_published

    add_column :stories, :logo_published, :boolean, default: false
    remove_column :successes, :logo_published

    add_column :stories, :publish_date, :datetime
    remove_column :successes, :publish_date

  end

end
