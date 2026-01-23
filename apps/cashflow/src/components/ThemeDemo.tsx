import React from "react";
import Button from "./UI/Button";

const ThemeDemo: React.FC = () => {
  return (
    <div className="container-responsive py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-business-text-primary mb-2">
          Business UI Theme Demo
        </h1>
        <p className="text-business-text-secondary">
          Showcasing the custom Tailwind CSS theme for the debt repayment
          application
        </p>
      </div>

      {/* Color Palette */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-business-text-primary">
          Color Palette
        </h2>
        <div className="grid-responsive">
          <div className="space-y-2">
            <h3 className="font-medium text-business-text-primary">
              Primary Colors
            </h3>
            <div className="space-y-1">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
                (shade) => (
                  <div key={shade} className="flex items-center space-x-2">
                    <div
                      className={`w-8 h-8 rounded bg-primary-${shade} border border-gray-300`}
                    ></div>
                    <span className="text-sm text-business-text-secondary">
                      primary-{shade}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-business-text-primary">
              Success Colors
            </h3>
            <div className="space-y-1">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
                (shade) => (
                  <div key={shade} className="flex items-center space-x-2">
                    <div
                      className={`w-8 h-8 rounded bg-success-${shade} border border-gray-300`}
                    ></div>
                    <span className="text-sm text-business-text-secondary">
                      success-{shade}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-business-text-primary">
              Warning Colors
            </h3>
            <div className="space-y-1">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
                (shade) => (
                  <div key={shade} className="flex items-center space-x-2">
                    <div
                      className={`w-8 h-8 rounded bg-warning-${shade} border border-gray-300`}
                    ></div>
                    <span className="text-sm text-business-text-secondary">
                      warning-{shade}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-business-text-primary">
              Danger Colors
            </h3>
            <div className="space-y-1">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
                (shade) => (
                  <div key={shade} className="flex items-center space-x-2">
                    <div
                      className={`w-8 h-8 rounded bg-danger-${shade} border border-gray-300`}
                    ></div>
                    <span className="text-sm text-business-text-secondary">
                      danger-{shade}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Button Components */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-business-text-primary">
          Button Components
        </h2>
        <div className="card-base p-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="success">Success Button</Button>
            <Button variant="warning">Warning Button</Button>
            <Button variant="danger">Danger Button</Button>
            <Button variant="secondary">Outline Button</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" size="sm">
              Small Primary
            </Button>
            <Button variant="secondary" size="sm">
              Small Secondary
            </Button>
            <Button variant="primary" size="lg">
              Large Primary
            </Button>
            <Button variant="secondary" size="lg">
              Large Secondary
            </Button>
          </div>
        </div>
      </section>

      {/* Card Components */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-business-text-primary">
          Card Components
        </h2>
        <div className="grid-responsive">
          <div className="card-base p-6">
            <h3 className="text-lg font-semibold text-business-text-primary mb-2">
              Basic Card
            </h3>
            <p className="text-business-text-secondary">
              This is a basic card with standard styling and shadow.
            </p>
          </div>
          <div className="card-interactive p-6 cursor-pointer">
            <h3 className="text-lg font-semibold text-business-text-primary mb-2">
              Interactive Card
            </h3>
            <p className="text-business-text-secondary">
              This card has hover effects and transforms on interaction.
            </p>
          </div>
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-business-text-primary mb-2">
              Elevated Card
            </h3>
            <p className="text-business-text-secondary">
              This card has a stronger shadow for more emphasis.
            </p>
          </div>
        </div>
      </section>

      {/* Form Components */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-business-text-primary">
          Form Components
        </h2>
        <div className="card-base p-6 max-w-md">
          <div className="space-y-4">
            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="Enter your email"
              />
              <p className="form-help">
                We'll never share your email with anyone else.
              </p>
            </div>
            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input-error"
                placeholder="Enter your password"
              />
              <p className="form-error">Password is required.</p>
            </div>
            <Button variant="primary" className="w-full">
              Submit Form
            </Button>
          </div>
        </div>
      </section>

      {/* Badge Components */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-business-text-primary">
          Badge Components
        </h2>
        <div className="card-base p-6">
          <div className="flex flex-wrap gap-2">
            <span className="badge-primary">Primary</span>
            <span className="badge-success">Success</span>
            <span className="badge-warning">Warning</span>
            <span className="badge-danger">Danger</span>
            <span className="badge-gray">Gray</span>
          </div>
        </div>
      </section>

      {/* Alert Components */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-business-text-primary">
          Alert Components
        </h2>
        <div className="space-y-3">
          <div className="alert-success">
            <p>This is a success alert with a green background and border.</p>
          </div>
          <div className="alert-warning">
            <p>This is a warning alert with a yellow background and border.</p>
          </div>
          <div className="alert-danger">
            <p>This is a danger alert with a red background and border.</p>
          </div>
          <div className="alert-info">
            <p>This is an info alert with a blue background and border.</p>
          </div>
        </div>
      </section>

      {/* Loading States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-business-text-primary">
          Loading States
        </h2>
        <div className="card-base p-6">
          <div className="flex items-center space-x-4">
            <div className="loading-spinner w-6 h-6"></div>
            <span className="text-business-text-secondary">Loading...</span>
          </div>
          <div className="mt-4 space-y-2">
            <div className="loading-skeleton h-4 w-full"></div>
            <div className="loading-skeleton h-4 w-3/4"></div>
            <div className="loading-skeleton h-4 w-1/2"></div>
          </div>
        </div>
      </section>

      {/* Animations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-business-text-primary">
          Animations
        </h2>
        <div className="grid-responsive">
          <div className="card-base p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-business-text-primary mb-2">
              Fade In
            </h3>
            <p className="text-business-text-secondary">
              This card fades in on load.
            </p>
          </div>
          <div className="card-base p-6 animate-slide-up">
            <h3 className="text-lg font-semibold text-business-text-primary mb-2">
              Slide Up
            </h3>
            <p className="text-business-text-secondary">
              This card slides up from below.
            </p>
          </div>
          <div className="card-base p-6 animate-scale-in">
            <h3 className="text-lg font-semibold text-business-text-primary mb-2">
              Scale In
            </h3>
            <p className="text-business-text-secondary">
              This card scales in from 95% to 100%.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ThemeDemo;
