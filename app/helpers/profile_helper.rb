module ProfileHelper

  def get_contribution id
    @contribution = Contribution.find id
  end

end
