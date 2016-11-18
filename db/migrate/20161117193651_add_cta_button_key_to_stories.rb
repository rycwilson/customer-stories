class AddCtaButtonKeyToStories < ActiveRecord::Migration

  def change

    add_reference :stories, :cta_button, index: true, foreign_key: true

  end

end
