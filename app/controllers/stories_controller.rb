class StoriesController < ApplicationController

  def index
    @stories = Company.find(params[:id]).stories
  end

  def show
    @story = Story.find params[:id]
  end

  def edit
    @story = Story.find params[:id]
    @company = current_user.company
    # options for new story customer select
    customers_select_options @company.customers
    # options for product categories select (multiple select)
    product_cats_select_options @company.product_categories
    # options for products select (single select for now)
    products_select_options @company.products
    # options for industries select (multiple select)
    industries_select_options @company.industry_categories
  end

  # TODO: allow for new Customer creation
  # Notice how nested hash keys are treated as strings in the params hash
  # -> due to the way form parameters are name-spaced
  def create
    @company = Company.find params[:id]
    new_story = params[:story]
    # was a new customer entered? ...
    new_customer = new_story[':customer'] if new_story[':customer'].to_i == 0
    if new_customer
      customer = Customer.new name: new_customer, company_id: @company.id
      if customer.save
        success = Success.new customer_id: customer.id
      else
        puts 'problem creating Customer'
      end
    else  # existing customer
      success = Success.new customer_id: new_story[':customer']
    end
    if success.save
      @story = Story.new title: new_story[':title'], success_id: success.id
      if @story.save
        assign_tags @story, new_story
        redirect_to edit_story_path @story
      else
        # problem creating story
        # TODO: wire up some flash messaging, possible to re-render the modal??
        puts 'problem creating Story'
      end
    else
      puts 'problem creating Success'
    end
  end

  def update
  end

  def destroy
  end

  private

  # Only necessary for mass assignment on db action create or update
  # def story_params
  #   params.require(:story).permit(:customer, :title,
  #       # note the tag arrays explicitly set as such, else they won't be permitted
  #       industry_tags: [], product_cat_tags: [], product_tags: [])
  # end

  def assign_tags story, new_story

    if new_story[':industry_tags']
      new_story[':industry_tags'].each do |selection|
        if selection.to_i == 0   # generic tag
          # create a new company industry category based on the generic tag
          story.success.industry_categories << IndustryCategory.create(
              name: selection, company_id: current_user.company.id)
        else  # selection is the id of an existing company industry category
          story.success.industry_categories << IndustryCategory.find(selection)
        end
      end
    end

    if new_story[':product_cat_tags']
      new_story[':product_cat_tags'].each do |selection|
        story.success.product_categories << ProductCategory.find(selection)
      end
    end

    if new_story[':prodcut_tags']
      new_story[':product_tags'].each do |selection|
        story.success.products << Product.find(selection)
      end
    end

  end

end
