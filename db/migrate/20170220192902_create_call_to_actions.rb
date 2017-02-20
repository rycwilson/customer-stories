class CreateCallToActions < ActiveRecord::Migration
  def change
    create_table :call_to_actions do |t|
      t.string :type
      t.references :company, index: true, foreign_key: true
      t.string :link_url
      t.string :description
      t.text :form_html
      t.string :display_text

      t.timestamps null: false
    end
  end
end
