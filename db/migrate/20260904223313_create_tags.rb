class CreateTags < ActiveRecord::Migration[7.2]
  def up
    create_table :tags do |t|
      t.string :name
      t.string :slug
      t.string :type
      t.references :company, foreign_key: true, index: false
      
      # This covers the company_id index (hence `index: false` on the references)
      t.index [:company_id, :type, :name], unique: true

      t.timestamps
    end

    create_join_table :successes, :tags do |t|
      t.index [:success_id, :tag_id], unique: true
      t.index [:tag_id, :success_id]
    end

    create_join_table :contributor_questions, :tags do |t|
      t.index [:contributor_question_id, :tag_id], unique: true
      t.index [:tag_id, :contributor_question_id]
    end

    create_join_table :call_to_actions, :tags do |t|
      t.index [:call_to_action_id, :tag_id], unique: true
      t.index [:tag_id, :call_to_action_id]
    end

    execute <<~SQL
      INSERT INTO tags (name, slug, type, company_id, created_at, updated_at)
      SELECT name, slug, 'Tag::Category', company_id, NOW(), NOW()
      FROM story_categories
    SQL

    execute <<~SQL
      INSERT INTO successes_tags (success_id, tag_id)
      SELECT
        scs.success_id,
        tags.id
      FROM story_categories_successes scs
      JOIN story_categories categories
        ON categories.id = scs.story_category_id
      JOIN tags
        ON tags.name = categories.name
        AND tags.company_id = categories.company_id
        AND tags.type = 'Tag::Category'
    SQL

    execute <<~SQL
      INSERT INTO tags (name, slug, type, company_id, created_at, updated_at)
      SELECT name, slug, 'Tag::Product', company_id, NOW(), NOW()
      FROM products
    SQL

    execute <<~SQL
      INSERT INTO successes_tags (success_id, tag_id)
      SELECT
        ps.success_id,
        tags.id
      FROM products_successes ps
      JOIN products
        ON products.id = ps.product_id
      JOIN tags
        ON tags.name = products.name
        AND tags.company_id = products.company_id
        AND tags.type = 'Tag::Product'
    SQL
  end

  def down
    drop_table :successes_tags
    drop_table :contributor_questions_tags
    drop_table :call_to_actions_tags
    drop_table :tags
  end
end
